import express from 'express';
import verifiedUsersRoutes from './routes/verifiedUsers';

const app = express();
app.use(express.json());

app.use(verifiedUsersRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
